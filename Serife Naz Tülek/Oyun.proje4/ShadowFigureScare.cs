using System.Collections;
using UnityEngine;

public class ShadowFigureScare : MonoBehaviour
{
    [Header("Demon")]
    public GameObject shadowFigure;
    public float visibleTime = 6f;

    [Header("Demon Spawn Points")]
    public Transform[] spawnPoints;

    [Header("Sound Before Demon")]
    public AudioClip scareSound;
    public float soundVolume = 1f;
    public float delayBeforeDemonAppears = 3f;

    [Header("Repeat Settings")]
    public bool repeatScare = true;
    public float minRepeatDelay = 20f;
    public float maxRepeatDelay = 40f;

    private bool started = false;
    private AudioSource audioSource;
    private int lastSpawnIndex = -1;

    void Awake()
    {
        audioSource = GetComponent<AudioSource>();

        if (audioSource == null)
        {
            audioSource = gameObject.AddComponent<AudioSource>();
        }

        audioSource.playOnAwake = false;
        audioSource.spatialBlend = 0f;
        audioSource.volume = soundVolume;
    }

    void Start()
    {
        if (shadowFigure != null)
        {
            shadowFigure.SetActive(false);
        }
    }

    private void OnTriggerEnter(Collider other)
    {
        if (started)
            return;

        if (!other.CompareTag("Player"))
            return;

        started = true;
        StartCoroutine(ScareLoop());
    }

    private IEnumerator ScareLoop()
    {
        while (true)
        {
            yield return StartCoroutine(ScareSequence());

            if (!repeatScare)
                break;

            float waitTime = Random.Range(minRepeatDelay, maxRepeatDelay);
            yield return new WaitForSeconds(waitTime);
        }
    }

    private IEnumerator ScareSequence()
    {
        if (scareSound != null)
        {
            audioSource.PlayOneShot(scareSound, soundVolume);
        }

        yield return new WaitForSeconds(delayBeforeDemonAppears);

        MoveDemonToRandomSpawn();

        if (shadowFigure != null)
        {
            shadowFigure.SetActive(true);
        }

        yield return new WaitForSeconds(visibleTime);

        if (shadowFigure != null)
        {
            shadowFigure.SetActive(false);
        }
    }

    private void MoveDemonToRandomSpawn()
    {
        if (shadowFigure == null)
            return;

        if (spawnPoints == null || spawnPoints.Length == 0)
            return;

        int randomIndex = Random.Range(0, spawnPoints.Length);

        if (spawnPoints.Length > 1)
        {
            while (randomIndex == lastSpawnIndex)
            {
                randomIndex = Random.Range(0, spawnPoints.Length);
            }
        }

        lastSpawnIndex = randomIndex;

        Transform selectedSpawn = spawnPoints[randomIndex];

        if (selectedSpawn == null)
            return;

        shadowFigure.transform.position = selectedSpawn.position;
        shadowFigure.transform.rotation = selectedSpawn.rotation;
    }
}